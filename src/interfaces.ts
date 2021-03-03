export interface IPayloadMetas {
    id: string;
    name: string;
    timestamp: number;
    correlationId?: string;
    replyTo?: string;
}

export interface IPayload {
    [key: string]: any;
    _metas? :Partial<IPayloadMetas>;
}

export interface IEventDispatcherOptions {
    url: string;
    service: string;
    metas: boolean;
    timeout: number;
}

export type EventHandlerFunction = (payload: IPayload) => Promise<IPayload | void | null> | IPayload | null | void;