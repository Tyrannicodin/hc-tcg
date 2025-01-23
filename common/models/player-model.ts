import {Socket} from 'socket.io'
import {Deck} from '../../common/types/deck'
import {PlayerInfo} from '../types/server-requests'
import {censorString} from '../utils/formatting'

export type PlayerId = string & {__player_id: never}

export class PlayerModel {
	private internalId: PlayerId
	private internalSecret: string
	private internalDeck: Deck | null
	public name: string
	public minecraftName: string
	public censoredName: string
	public socket: Socket
	public uuid: string
	public authenticated: boolean
	public achievementProgress:
		| {progress: Buffer<ArrayBuffer>; completedDate: number | null}[]
		| undefined

	constructor(playerName: string, minecraftName: string, socket: Socket) {
		this.internalId = Math.random().toString() as PlayerId
		this.internalSecret = Math.random().toString()

		this.internalDeck = null

		this.name = playerName
		this.minecraftName = minecraftName
		this.censoredName = censorString(playerName)
		this.socket = socket
		this.uuid = ''
		this.authenticated = false
	}

	public get id() {
		return this.internalId
	}
	public get secret() {
		return this.internalSecret
	}
	public get deck() {
		return this.internalDeck
	}

	getPlayerInfo(): PlayerInfo {
		return {
			playerId: this.id,
			playerSecret: this.secret,
			playerDeck: this.deck,
			playerName: this.name,
			minecraftName: this.minecraftName,
			censoredPlayerName: this.censoredName,
		}
	}

	setPlayerDeck(newDeck: Deck) {
		this.internalDeck = {
			name: newDeck.name,
			//@ts-ignore
			iconType: newDeck.iconType,
			icon: newDeck.icon,
			cards: newDeck.cards,
			code: newDeck.code,
			tags: newDeck.tags,
		}
	}

	setMinecraftName(name: string) {
		this.minecraftName = name
	}
}
