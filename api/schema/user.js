const { gql } = require('apollo-server-lambda');

const userDefs = gql`
	extend type Query {
		me: User
		getUserStreak: Streak!
		getTopStreaks: [Streak!]
		getGroupLeaderboard: [Streak]
	}
	
	extend type Mutation {
		signup(input: SignupInput!): String
		login(email: String!, password: String!): String
		registerPushNotification(token: String! reminder: Reminder): String @requireAuth(role: USER)
		addMemberToGroup(group: String!): String
	} 

	input SignupInput {
		username: String!
		password: String!
		email: String!
		manager: String
	}

	type User {
		user_id: String
		username: String
		email: String
		created_at: String
		role: [String]
		manager: String
	}

	type Streak {
		username: String
		user_id: String
		score: Int
	}
`;

module.exports = userDefs;
