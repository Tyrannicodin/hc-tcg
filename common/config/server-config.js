export default {
	port: 9000,
	clientDevPort: 3002,
	clientPath: 'client/dist',
	cors: [
		'http://localhost:3002',
		'https://hc-tcg-beta.fly.dev',
		'https://hc-tcg-testing.fly.dev',
		'https://hc-tcg.online',
		'https://testing.hc-tcg.online',
	],
	world: 'LTF42',
	limits: {
		maxTurnTime: 90,
		extraActionTime: 30,
		minCards: 42,
		maxCards: 42,
		maxDuplicates: 3,
		maxDeckCost: 42,
		bannedCards: ['evilxisuma_boss', 'feather', 'full_bundle'],
	},
	logoSubText: 'EX-tra fun!',
}
