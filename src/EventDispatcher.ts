import { v4 as uuid } from 'uuid'
import { IPayload, IPayloadMetas, EventHandlerFunction, IEventDispatcherOptions } from './interfaces'
import { defaultOpions } from './helpers/defaults';
import * as adapter from './adapter'
import * as amqp from 'amqplib'

export class EventDispatcher {
    private options: IEventDispatcherOptions;


    constructor(options?: Partial<IEventDispatcherOptions>) {
        this.options = { ...defaultOpions, ...options }
    }

    public async initialize()
    {
        // Check amqp connection
        try {
            adapter.connect(this.options.url)
        } catch (e) {
            throw new Error(`Can't connect to RabbitMQ, Error: ${e}`)
        }
    }

    public async on(event: string, handler: EventHandlerFunction) {
        const channel = await adapter.createChannel(this.options.url)
        const queue = `${this.options.service}::${event}`
        const exchange = await adapter.createExchange(channel, event)

        await adapter.createQueue(channel, queue, exchange)
        await channel.consume(queue, message => {
            if (message) {
                return new Promise((resolve, reject) => {
                    const payload: IPayload = JSON.parse(message.content.toString()) as IPayload
                    const instance = handler(payload)

                    if (instance instanceof Promise) {
                        instance
                            .then(response => {
                                return this.responseIfNeeded(payload, response as any)
                            })
                            .then(res => resolve(res))
                            .catch(err => reject(err))
                    } else {
                        this.responseIfNeeded(payload, instance as any)
                            .then(res => resolve(res))
                            .catch(err => reject(err))
                    }
                    
                    channel.ack(message)
                })
            }
        })
    }

    public async notification(event: string, payload: IPayload) {
        return this.emit(event, payload)
    }

    public async request(event: string, payload: IPayload): Promise<IPayload> {
        return new Promise(async (resolve, reject) => {
            const correlationId = uuid()
            const replyTo = `${event}::${correlationId}`

            const newMetas = payload._metas
            ? {
                correlationId,
                replyTo,
                ...payload._metas
            } : {
                correlationId,
                replyTo
            }

            const listen = () => new Promise((resolve, reject) => {
                this.on(replyTo, async (payload: IPayload) => {
                    resolve(payload)
                })
            })

            const timeout = () => new Promise((_, reject) => {
                setTimeout(() => reject(`Timeout: ${event}, correlationId: ${correlationId}`), this.options.timeout)
            })

            let channel: amqp.Channel
            let queue: string = `${this.options.service}::${replyTo}`

            const result = Promise.race([listen(), timeout()])
                .then(async (payload: any) => {
                    const channel = await adapter.createChannel(this.options.url)

                    await channel.deleteQueue(queue)
                    await channel.deleteExchange(replyTo)
                    resolve(payload)
                })
                .catch(err => {
                    setImmediate(async () => {
                        if (channel) {
                            await channel.deleteExchange(replyTo)
                            await channel.deleteQueue(queue)
                        }
                    })

                    reject(err)
                })

                await this.emit(event, { ...payload, _metas: newMetas })
                return result
        })
    }

    private async emit(event: string, payload: IPayload) {
        try {
            payload = this.generateMetasInformation(payload, event)
            const channel = await adapter.createChannel(this.options.url)

            await adapter.createExchange(channel, event);
            return await adapter.publish(channel, event, payload)
        } catch (e) {
            console.error(`${e}`)
        }
    }

    private async responseIfNeeded(source: IPayload, target: IPayload): Promise<IPayload | void> {
        if (source && source._metas && source._metas.replyTo && source._metas.correlationId) {
            const newPayload = {
                _metas: {
                    correlationId: source._metas.correlationId
                },
                ...target
            }

            return this.emit(source._metas.replyTo, newPayload)
        }
    }

    private generateMetasInformation (payload: IPayload, event: string): IPayload {
        if (!this.options.metas) {
            return payload
        }
        const override = payload._metas ? payload._metas : {}
        const metas: IPayloadMetas = {
            id: uuid(),
            name: event,
            timestamp: Date.now(),
            ...override
        }

        return { ...payload, _metas: metas} 
    }
}
