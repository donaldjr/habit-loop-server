import createConnection, { Redis } from 'ioredis';
import Pino from 'pino';
import moment from 'moment';
import _ from 'lodash';

const getConnection: () => Promise<Redis> = () =>
  new Promise((resolve, reject) => {
    const redisClient = new createConnection({
      host: process.env.REDIS_HOST,
      password: process.env.REDIS_PASSWORD,
      port: parseInt(process.env.REDIS_PORT),
      connectTimeout: 2000,
      maxRetriesPerRequest: 5,
    });

    redisClient.on('connect', () => {
      Pino().info(`Redis client connected to host ${process.env.REDIS_HOST}`);
    });
    redisClient.on('error', err => reject(err));

    redisClient.on('close', () => {
      Pino().info('Closing connection!');
    });

    return resolve(redisClient);
  });

export default async () => {
  const client: Redis = await getConnection();

  return {
    getConnection: async () => {
      if (_.isNil(client)) {
        return getConnection();
      }
      return client;
    },

    disconnect: () => client.quit(),

    streak: {
      getCompletedHabits: async (user_id: string) => {
        const habits = await client
          .multi()
          .lrange(`${user_id}|DAILY`, 0, -1)
          .lrange(`${user_id}|WEEKLY`, 0, -1)
          .exec();

        return [...habits[0][1], ...habits[1][1]];
      },

      completeHabit: (user_id: string, habit_id: string, recurrence: string) => {
        if (recurrence === 'DAILY') {
          client.rpush(`${user_id}|DAILY`, habit_id);

          return client.expireat(
            `${user_id}|DAILY`,
            moment()
              .endOf('day')
              .unix()
          );
        }

        if (recurrence === 'WEEKLY') {
          client.rpush(`${user_id}|WEEKLY`, habit_id);

          // first day of week according to iso is monday
          return client.expireat(
            `${user_id}|WEEKLY`,
            moment()
              .endOf('isoWeek')
              .unix()
          );
        }

        return 0;
      },

      completedHabitToday: (user_id: string) => client.exists(`${user_id}|DAILY`),
    },
  };
};
