package main

import (
	"github.com/pulumi/pulumi-gcp/sdk/v6/go/gcp/appengine"
	"github.com/pulumi/pulumi-gcp/sdk/v6/go/gcp/sql"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Create a GCP SQL Database instance for dilution-demo
		dilutionDemoDbInstance, err := sql.NewDatabaseInstance(ctx, "dilution-demo-sql", &sql.DatabaseInstanceArgs{
			DatabaseVersion: pulumi.String("MYSQL_5_7"),
			Region:          pulumi.String("us-central1"),
			Settings: &sql.DatabaseInstanceSettingsArgs{
				Tier: pulumi.String("db-f1-micro"),
			},
		})
		if err != nil {
			return err
		}

		// Create a database within the dilution-demo instance
		_, err = sql.NewDatabase(ctx, "dilutionDemoDatabase", &sql.DatabaseArgs{
			Instance: dilutionDemoDbInstance.Name,
			Name:     pulumi.String("dilution-demo-db"),
		})

		if err != nil {
			return err
		}

		// Create an App Engine application for dilution-demo
		dilutionDemoApp, err := appengine.NewApplication(ctx, "xenon-ascent-415220", &appengine.ApplicationArgs{
			Project:    pulumi.String("xenon-ascent-415220"),
			LocationId: pulumi.String("us-central"),
		}, pulumi.Import(pulumi.ID("xenon-ascent-415220")))
		if err != nil {
			return err
		}

		// Export the dilution-demo database connection name
		ctx.Export("dilutionDemoInstanceConnectionName", dilutionDemoDbInstance.ConnectionName)
		// Export the dilution-demo Database Host and Port
		ctx.Export("dilutionDemoDatabaseHost", pulumi.Sprintf("%s", dilutionDemoDbInstance.PublicIpAddress))
		// Export the dilution-demo App Engine App URL
		ctx.Export("dilutionDemoAppUrl", pulumi.Sprintf("https://%s.appspot.com", dilutionDemoApp.ID()))

		return nil
	})
}
