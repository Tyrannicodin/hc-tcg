import {Achievement} from '../achievements/types'

export type Cosmetic = {
	type: 'title' | 'coin' | 'heart' | 'background' | 'border'
	id: string
	name: string
	requires?: Achievement['id']
}

export type Title = Cosmetic & {type: 'title'}

export type Coin = Cosmetic & {
	type: 'coin'
	borderColor: string
}

export type Heart = Cosmetic & {type: 'heart'}

export type Background = Cosmetic & {type: 'background'}

export type Border = Cosmetic & {type: 'border'}

export type Appearance = {
	title: Title
	coin: Coin
	heart: Heart
	background: Background
	border: Border
}
