import Ailment from "./ailment"
import FireAilment from "./fire"
import PoisonAilment from "./poison"
import SleepingAilment from "./sleeping"
import BadOmenAilment from "./badomen"
import SlownessAilment from "./slowness"
import WeaknessAilment from "./weakness"
import ProtectedAilment from "./protected"
import DyedAilment from "./dyed"

const cardClasses: Array<Ailment> = [
	new FireAilment(),
    new PoisonAilment(),
    new SleepingAilment(),
    new BadOmenAilment(),
    new SlownessAilment(),
    new WeaknessAilment(),
    new ProtectedAilment(),
    new DyedAilment()
]

export const AILMENTS: Record<string, Ailment> = cardClasses.reduce(
	(result: Record<string, Ailment>, card) => {
		result[card.id] = card
		return result
	},
	{}
)
