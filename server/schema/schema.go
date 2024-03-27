package schema

import (
	"dilution-demo/repository"

	"github.com/graphql-go/graphql"
)

var AccountType = graphql.NewObject(graphql.ObjectConfig{
	Name: "Account",
	Fields: graphql.Fields{
		"id": &graphql.Field{
			Type: graphql.NewNonNull(graphql.String),
		},
		"owner": &graphql.Field{
			Type: graphql.String,
		},
	},
})

var AccountQueryType = graphql.NewObject(graphql.ObjectConfig{
	Name: "AccountQuery",
	Fields: graphql.Fields{
		"account": &graphql.Field{
			Type: AccountType,
			Args: graphql.FieldConfigArgument{
				"owner": &graphql.ArgumentConfig{
					Type: graphql.String,
				},
			},
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				owner, _ := p.Args["owner"].(string)
				account, err := repository.GetAccount(owner)
				if err != nil {
					return nil, err
				}
				return account, nil
			},
		},
	},
})

var StockTransactionType = graphql.NewObject(graphql.ObjectConfig{
	Name: "StockTransaction",
	Fields: graphql.Fields{
		"id": &graphql.Field{
			Type: graphql.NewNonNull(graphql.Int),
		},
		"account_uuid": &graphql.Field{
			Type: graphql.NewNonNull(graphql.String),
		},
		"type": &graphql.Field{
			Type: graphql.String,
		},
		"date": &graphql.Field{
			Type: graphql.DateTime,
		},
		"grant_date": &graphql.Field{
			Type: graphql.DateTime,
		},
		"vesting_date": &graphql.Field{
			Type: graphql.DateTime,
		},
		"expiration_date": &graphql.Field{
			Type: graphql.DateTime,
		},
		"number_of_shares": &graphql.Field{
			Type: graphql.Int,
		},
	},
})

var AccountStatementType = graphql.NewObject(graphql.ObjectConfig{
	Name: "AccountStatement",
	Fields: graphql.Fields{
		"id": &graphql.Field{
			Type: graphql.NewNonNull(graphql.Int),
		},
		"account_uuid": &graphql.Field{
			Type: graphql.NewNonNull(graphql.String),
		},
		"shares": &graphql.Field{
			Type: graphql.Int,
		},
		"vested_options": &graphql.Field{
			Type: graphql.Int,
		},
		"unvested_options": &graphql.Field{
			Type: graphql.Int,
		},
	},
})

var Schema, _ = graphql.NewSchema(graphql.SchemaConfig{
	Query: AccountQueryType,
})