import {CardPosModel} from '../../../models/card-pos-model'
import {GameModel} from '../../../models/game-model'
import {CardInstance} from '../../../types/game-state'
import Card, {Item, item} from '../../base/card'

class TerraformRareItemCard extends Card {
	props: Item = {
		...item,
		id: 'item_terraform_rare',
		numericId: 68,
		name: 'Terraform Item x2',
		shortName: 'Terraform',
		expansion: 'default',
		rarity: 'rare',
		tokens: 2,
		type: 'terraform',
	}

	override getEnergy(game: GameModel, instance: CardInstance, pos: CardPosModel) {
		return [this.props.type, this.props.type]
	}
}

export default TerraformRareItemCard
