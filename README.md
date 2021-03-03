# EventDispatcher
EventDispatcher over RabbitMQ.

## Api reference
    initialize(): Promise<void>;
Check connection with RabbitMQ, throw error when failed.

    on(event: string, handler: EventHandlerFunction): Promise<void>;
register new event handler

    notification(event: string, payload: IPayload): Promise<any>;
Sends new event, does not wait for reply

    request(event: string, payload: IPayload): Promise<IPayload>;
Sends new event and wait for reply


## Authors
* **Dominik Szamburski** - *Initial work* - [macotsuu](https://github.com/macotsuu)

See also the list of [contributors](https://github.com/macotsuu/event-dispatcher/contributors) who participated in this project.

## License
This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details