import { IEventDispatcherOptions } from '../interfaces'

export const defaultOpions: IEventDispatcherOptions = {
    url: 'amqp://localhost',
    service: 'default',
    metas: true,
    timeout: 30000
}