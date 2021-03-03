import * as amqp from 'amqplib'

let connection: amqp.Connection | null = null
let channel: amqp.Channel | null = null

export async function connect(url: string): Promise<amqp.Connection> {
    try {
        if (connection === null) {
            connection = await amqp.connect(url)
        }

        return connection
    } catch (e) {
        throw e
    }
}

export async function createChannel(url: string): Promise<amqp.Channel> {
    try {
        if (channel === null) {
            const connection = await amqp.connect(url)
            channel = await connection.createChannel()
        }

        return channel
    } catch (e) {
        throw e
    }
}

export async function createQueue(channel: amqp.Channel, queue: string, exchange: string): Promise<string> {
    try {
        await channel.assertQueue(queue, { durable: true, autoDelete: false })
        await channel.bindQueue(queue, exchange, '')
        await channel.prefetch(1)

        return queue
    } catch (e) {
        throw e
    }
}

export async function createExchange(channel: amqp.Channel, name: string) {
    try {
        await channel.assertExchange(name, 'fanout', { durable: true, autoDelete: false })
        return name
    } catch (e) {
        throw e
    }
}

export async function publish(channel: amqp.Channel, exchange: string, payload: any): Promise<any> {
    return new Promise((resolve, reject) => {
        try {
            channel.publish(
                exchange, 
                '', 
                Buffer.from(JSON.stringify(payload)), 
                {
                    persistent: true,
                    timestamp: payload._metas ? payload._metas.timestamp : Date.now(),
                    messageId: payload._metas.id ? payload._metas.id : ''
                }
            )

            resolve(payload)
        } catch (e) {
            reject(e)
        }
    })
}
