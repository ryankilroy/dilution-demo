package schema

import (
	"github.com/graphql-go/graphql"
	"github.com/graphql-go/graphql/language/ast"
)

func GetSelectedFieldNames(p *graphql.ResolveParams)  []string {
	selectionFieldNames := []string{}
	for _, field := range p.Info.FieldASTs {
		for _, selection := range field.SelectionSet.Selections {
			selectionName := selection.(*ast.Field).Name.Value
			selectionFieldNames = append(selectionFieldNames, selectionName)
		}
	}
	return selectionFieldNames
}