declare namespace Lilbird {}

declare class Lilbird {
    identify<T>(userId: string, userProperties?: T): void;
    track<T>(eventName: string, eventProperties?: T): void;
    init<T>(properties?: T): void;
}

export = Lilbird;