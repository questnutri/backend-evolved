import { Controller, All, Req, Res, Headers, BadRequestException } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';
import * as jwt from 'jsonwebtoken';

@Controller()
export class GatewayController {
    // Map incoming path prefixes to service base URLs. Use environment variables to override.
    private getTarget(path: string | undefined): string | undefined {
        if (!path) return undefined;
        switch (path) {
            case 'admin': return process.env.ADMIN_SERVICE_URL ?? 'http://localhost:3030';
            case 'auth': return process.env.AUTH_SERVICE_URL ?? 'http://localhost:3032';
            case 'nutritionist': return process.env.NUTRITIONIST_SERVICE_URL ?? 'http://localhost:3033';
            case 'patient': return process.env.PATIENT_SERVICE_URL ?? 'http://localhost:3034';
            default: return undefined;
        }
    }

    @All('/*splat')
    async proxy(
        @Req() req: Request,
        @Res() res: Response,
        @Headers('authorization') authHeader: string
    ) {
        const splat = (req as Request).params?.splat || [];
        const choosedService = splat.at(0);
        const targetBase = this.getTarget(choosedService);
        console.log(`Proxying request for ${req.path} to ${targetBase}`);
        if (!targetBase) {
            console.log(`No service found for ${choosedService}`);
            return res.status(502).json({ error: 'No target service configured for this path' });
        }

        let decoded: any = null;

        if (authHeader) {
            try {
                decoded = jwt.verify(
                    authHeader?.replace('Bearer ', '') || '',
                    process.env.JWT_SECRET as string
                ) as jwt.JwtPayload;
            } catch (error: any) {
                if (error instanceof jwt.TokenExpiredError) {
                    throw new BadRequestException('Token expired');
                } else if (error instanceof jwt.JsonWebTokenError) {
                    console.log(`Access failed due an invalid token`);
                    console.log(error);
                    throw new BadRequestException('Invalid token');
                }
            }
        }

        const targetUrl = new URL(targetBase + (Array.isArray(splat) ? '/' + splat.join('/') : '/' + splat));
        const options: http.RequestOptions = {
            protocol: targetUrl.protocol,
            hostname: targetUrl.hostname,
            port: targetUrl.port,
            path: targetUrl.pathname + targetUrl.search,
            method: req.method,
            headers: {
                ...req.headers,
                host: targetUrl.host,
            }
        };
        // Add user sub to headers if it exists
        if (decoded && decoded?.sub && decoded?.role) {
            options.headers = {
                ...options.headers,
                'user-id': decoded.sub.toString(),
                'role': decoded.role.toString()
            };
        }

        const client = targetUrl.protocol === 'https:' ? https : http;

        const proxyReq = client.request(options, (proxyRes) => {
            // forward status and headers
            res.status(proxyRes.statusCode ?? 502);
            Object.entries(proxyRes.headers).forEach(([k, v]) => {
                if (v) res.setHeader(k, v as string);
            });
            // pipe response data
            proxyRes.pipe(res);
        });

        proxyReq.on('error', (err) => {
            if (!res.headersSent) {
                const serviceName = (choosedService ?? '').toUpperCase().slice(0, 1) + (choosedService ?? '').toLowerCase().slice(1);
                console.error(`Proxy Error: ${serviceName} Service unreachable`);
                res.status(504).json({ error: `${serviceName} Service is currently unavailable.` });
            }
        });

        // pipe request body (works when bodyParser is disabled)
        req.pipe(proxyReq);

        // Ensure all code paths return a value
        return;
    }
}
