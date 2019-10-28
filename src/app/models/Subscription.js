import { Model } from 'sequelize';

class Subscription extends Model {
  static init(sequelize) {
    super.init(
      {},
      {
        sequelize,
      }
    );
  }

  static associate(models) {
    this.belongsTo(models.User, { foreignKey: 'user_id', as: 'provider' });
    this.belongsTo(models.Meetup, { foreignKey: 'meetup_id' });
  }
}

export default Subscription;
