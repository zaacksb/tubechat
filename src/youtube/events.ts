
interface User {
	id: string;
	login: string;
}

interface UserExtra extends User {
	isBroadcaster: boolean;
	isMod: boolean;
	isSubscriber: boolean;
	isFounder: boolean;
	isTurbo: boolean;
}

export namespace Message {
	
	interface BaseEvent {
		channel: {};
		user: UserExtra;
		message: {
			id: string;
			text: string;
		};
	}
	export interface EventRegular extends BaseEvent {
		// announcement: undefined;
		// cheer?: Cheer;
		// parent?: ReplyParent;
		// reward?: Reward;
		// tags: Tags;
	}
	export interface EventAnnouncement extends BaseEvent {
		// announcement: Announcement;
		// cheer: undefined;
		// parent: undefined;
		// reward: undefined;
		// tags: TagsAnnouncement;
	}
}