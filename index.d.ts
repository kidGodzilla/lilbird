declare namespace Lilbird {}

declare interface Lilbird {
    identify<T>(userId: string, userProperties?: T): void;
    track<T>(eventName: string, eventProperties?: T): void;
    init<T>(configuration?: T): void;
}

export = Lilbird;