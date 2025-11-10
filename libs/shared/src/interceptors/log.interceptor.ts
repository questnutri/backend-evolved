import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class LogInjector implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        // if(context.getType() === 'rpc') {
        //     const contextArgs = context.getArgByIndex(0);
        //     if(!("log-id" in contextArgs)) {
        //         context.getArgByIndex(0)['log-id'] = Math.floor(1000 + Math.random() * 9000);
        //     }
        // } else 
        if (context.getType() === 'http') {
            const request = context.switchToHttp().getRequest();
            request.headers['log-id'] = Math.floor(1000 + Math.random() * 9000);
        }

        return next.handle();
    }
}

@Injectable()
export class LogReceiver implements NestInterceptor {
    intercept(context: ExecutionContext, next: CallHandler<any>): Observable<any> | Promise<Observable<any>> {
        if (context.getType() === 'rpc') {
            console.log('Received log id:', context.getArgByIndex(1).args.at(0).properties);
        }
        return next.handle();
    }
}