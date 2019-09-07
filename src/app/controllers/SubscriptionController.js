import { Op } from 'sequelize';
import Queue from '../../lib/Queue';
import Meetup from '../models/Meetup';
import Subscription from '../models/Subscription';
import User from '../models/User';
import SubscriptionMail from '../jobs/SubscriptionMail';

class MeetupController {
  async index(req, res) {
    const subscriptions = await Subscription.findAll({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          where: {
            date: {
              [Op.gt]: new Date(),
            },
          },
          required: true,
        },
      ],
      order: [[Meetup, 'date']],
    });

    return res.json(subscriptions);
  }

  async store(req, res) {
    const meetup = await Meetup.findByPk(req.params.meetupId, {
      include: [User],
    });

    /**
     * Check if this meet is own
     */
    if (meetup.user_id === req.userId) {
      return res
        .status(400)
        .json({ error: 'You can not subscribe in your own meetups' });
    }

    /**
     * Check for past dates
     */
    if (meetup.past) {
      return res
        .status(400)
        .json({ error: 'Subscribe in a past meetup is not permitted' });
    }

    /**
     * Check if the user have already subscription in this date of meetup
     */
    const meetupSubscribed = await Subscription.findOne({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            id: meetup.id,
          },
        },
      ],
    });

    if (meetupSubscribed) {
      return res.status(400).json({
        error: 'Sorry, you can not subscribe two times in a same meetup',
      });
    }

    /**
     * Check if the user have already subscription in this date of meetup
     */
    const meetupDate = await Subscription.findOne({
      where: {
        user_id: req.userId,
      },
      include: [
        {
          model: Meetup,
          required: true,
          where: {
            date: meetup.date,
          },
        },
      ],
    });

    if (meetupDate) {
      return res.status(400).json({
        error: 'Sorry, you can not subscribe in two meetups at the same time',
      });
    }

    const user_id = req.userId;
    const meetup_id = req.params.meetupId;

    const subscription = await Subscription.create({
      user_id,
      meetup_id,
    });

    const user = await User.findByPk(req.userId);

    await Queue.add(SubscriptionMail.key, {
      meetup,
      user,
    });

    return res.json(subscription);
  }
}

export default new MeetupController();
