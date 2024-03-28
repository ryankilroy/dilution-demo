package schema

import (
	"dilution-demo/repository"
	"fmt"

	models "dilution-demo/db/models"

	"github.com/graphql-go/graphql"
)

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
		"shares": &graphql.Field{
			Type: graphql.Int,
		},
	},
})

var CompanyCapitalizationSnapshotType = graphql.NewObject(graphql.ObjectConfig{
	Name: "CompanyCapitalizationSnapshot",
	Fields: graphql.Fields{
		"stock_transaction_id": &graphql.Field{
			Type: graphql.NewNonNull(graphql.Int),
		},
		"unissued_shares": &graphql.Field{
			Type: graphql.Int,
		},
		"outstanding_shares": &graphql.Field{
			Type: graphql.Int,
		},
		"unvested_options": &graphql.Field{
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
		"date": &graphql.Field{
			Type: graphql.DateTime,
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

var AccountType = graphql.NewObject(graphql.ObjectConfig{
	Name: "Account",
	Fields: graphql.Fields{
		"uuid": &graphql.Field{
			Type: graphql.NewNonNull(graphql.String),
		},
		"owner": &graphql.Field{
			Type: graphql.String,
		},
		"stock_transactions": &graphql.Field{
			Type: graphql.NewList(StockTransactionType),
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				fmt.Println("resolve stocktransaction")
				fmt.Println("p.Source: ", p.Source)
				if account, ok := p.Source.(*models.Account); ok {
						return account.StockTransactions, nil
				}
				return nil, nil
			},
		},
		"account_statements": &graphql.Field{
			Type: graphql.NewList(AccountStatementType),
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				fmt.Println("resolve accountstatement")
				if account, ok := p.Source.(*models.Account); ok {
						return account.AccountStatements, nil
				}
				return nil, nil
			},
		},
	},
})

var RootQueryType = graphql.NewObject(graphql.ObjectConfig{
	Name: "RootQuery",
	Fields: graphql.Fields{
		"accounts": &graphql.Field{
			Type: graphql.NewList(AccountType),
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				selectedFieldNames := GetSelectedFieldNames(&p)
				accounts, err := repository.GetAccounts("", selectedFieldNames)
				if err != nil {
					return nil, err
				}
				return accounts, nil
			},
		},
		"account": &graphql.Field{
			Type: AccountType,
			Args: graphql.FieldConfigArgument{
				"owner": &graphql.ArgumentConfig{
					Type: graphql.String,
				},
			},
			Resolve: func(p graphql.ResolveParams) (interface{}, error) {
				owner, _ := p.Args["owner"].(string)
				selectedFieldNames := GetSelectedFieldNames(&p)
				account, err := repository.GetAccount(owner, selectedFieldNames)
				if err != nil {
					return nil, err
				}
				return account, nil
			},
		},
		"stock_transactions": &graphql.Field{
			Type: StockTransactionType,
			Args: graphql.FieldConfigArgument{
				"id": &graphql.ArgumentConfig{
					Type: graphql.Int,
				},
				"type": &graphql.ArgumentConfig{
					Type: graphql.String,
				},
			},
			// TODO: Get StockTransaction by Type
			// Resolve: func(p graphql.ResolveParams) (interface{}, error) {
			// 	id, _ := p.Args["id"].(int)
			// 	transactionType, _ := p.Args["type"].(string)
			// 	stockTransaction, err := repository.GetStockTransaction(id, accountUUID)
			// 	if err != nil {
			// 		return nil, err
			// 	}
			// 	return stockTransaction, nil
			// },
		},
	},
})


var Schema, _ = graphql.NewSchema(graphql.SchemaConfig{
	Query: RootQueryType,
})