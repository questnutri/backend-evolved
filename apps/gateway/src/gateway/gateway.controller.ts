import { Controller, All, Req, Res, Headers, Get, Redirect } from '@nestjs/common';
import type { Request, Response } from 'express';
import * as http from 'http';
import * as https from 'https';
import { URL } from 'url';

@Controller()
export class GatewayController {
    // Flag to control whether to add service prefix to forwarded paths
    private readonly ADD_SERVICE_PREFIX = false;

    // Map incoming path prefixes to service base URLs. Use environment variables to override.
    private getTarget(path: string | undefined): string | undefined {
        if (!path) return undefined;
        switch (path) {
            case 'admin': return process.env.DEV_ADMIN_SERVICE_URL ?? 'http://admin-service:3000';
            case 'auth': return process.env.DEV_AUTH_SERVICE_URL ?? 'http://auth-service:3000';
            case 'nutritionist': return process.env.DEV_NUTRITIONIST_SERVICE_URL ?? 'http://nutritionist-service:3000';
            case 'patient': return process.env.DEV_PATIENT_SERVICE_URL ?? 'http://patient-service:3000';
            case 'diet': return process.env.DEV_DIET_SERVICE_URL ?? 'http://diet-service:3000';
            case 'aliment': return process.env.DEV_ALIMENT_SERVICE_URL ?? 'http://aliment-service:3000';
            case 'record': return process.env.DEV_RECORD_SERVICE_URL ?? 'http://record-service:3000';
            default: return undefined;
        }
    }

    private async checkServiceHealth(serviceUrl: string): Promise<boolean> {
        return new Promise((resolve) => {
            try {
                const url = new URL(serviceUrl + '/health');
                const client = url.protocol === 'https:' ? https : http;

                // console.log(`Checking health for: ${url.href}`);

                const options: http.RequestOptions = {
                    protocol: url.protocol,
                    hostname: url.hostname,
                    port: url.port,
                    path: url.pathname,
                    method: 'GET',
                    timeout: 3000
                };

                const req = client.request(options, (res) => {
                    // console.log(`Health check response for ${serviceUrl}: ${res.statusCode}`);
                    resolve(res.statusCode === 200);
                });
                // console.log(req);

                req.on('error', (err) => {
                    // console.log(`Health check error for ${serviceUrl}:`, err.message);
                    resolve(false);
                });

                req.on('timeout', () => {
                    // console.log(`Health check timeout for ${serviceUrl}`);
                    req.destroy();
                    resolve(false);
                });

                req.end();
            } catch (error) {
                // console.log(`Health check exception for ${serviceUrl}:`, error);
                resolve(false);
            }
        });
    }

    @Get('health')
    async healthCheck() {
        const services = ['admin', 'auth', 'nutritionist', 'patient', 'diet', 'aliment', 'record'];
        const serviceStatus: { [key: string]: boolean } = {};

        const healthChecks = services.map(async (service) => {
            let serviceUrl = this.getTarget(service);
            if (serviceUrl) {
                serviceStatus[service] = await this.checkServiceHealth(serviceUrl);
            } else {
                serviceStatus[service] = false;
            }
        });

        await Promise.all(healthChecks);

        const sortedServiceStatus = Object.keys(serviceStatus)
            .sort()
            .reduce((acc, key) => {
                acc[key] = serviceStatus[key];
                return acc;
            }, {} as { [key: string]: boolean });

        // console.log('Final service status:', sortedServiceStatus);

        return {
            'services-status': sortedServiceStatus
        };
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

        if (!targetBase) {
            console.log(`No service found for ${choosedService}`);
            return res.status(502).json({ error: 'No target service configured for this path' });
        }

        let decoded: any = null;

        let forwardedPath: string;
        if (Array.isArray(splat) && splat.length > 1 && splat[1] === 'graphql') {
            forwardedPath = '/' + splat.slice(1).join('/');
        } else {
            // Include or exclude service name prefix based on ADD_SERVICE_PREFIX flag
            if (this.ADD_SERVICE_PREFIX) {
                forwardedPath = Array.isArray(splat) ? '/' + splat.join('/') : '/' + splat;
            } else {
                forwardedPath = Array.isArray(splat) && splat.length > 1 ? '/' + splat.slice(1).join('/') : '/';
            }
        }

        // Preserve the original query string
        const queryString = req.url?.includes('?') ? req.url.substring(req.url.indexOf('?')) : '';
        const targetUrl = new URL(targetBase + forwardedPath + queryString);
        console.log(`Final forwarded URL: ${targetUrl.href}`);

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
