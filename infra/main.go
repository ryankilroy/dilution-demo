package main

import (
	"fmt"
	"os"

	"github.com/pulumi/pulumi-gcp/sdk/v7/go/gcp/appengine"
	"github.com/pulumi/pulumi-gcp/sdk/v7/go/gcp/sql"
	"github.com/pulumi/pulumi/sdk/v3/go/pulumi"
)

func main() {
	pulumi.Run(func(ctx *pulumi.Context) error {
		// Create a GCP SQL Database instance for dilution-demo
		dilutionDemoDbInstance, err := sql.NewDatabaseInstance(ctx, "dilution-demo-postgresql", &sql.DatabaseInstanceArgs{
			DatabaseVersion: pulumi.String("POSTGRES_13"),
			Region:          pulumi.String("us-central1"),
			DeletionProtection: pulumi.Bool(false),
			Settings: &sql.DatabaseInstanceSettingsArgs{
				Tier:                      pulumi.String("db-f1-micro"),
				DeletionProtectionEnabled: pulumi.Bool(false),
			},
		}, pulumi.Protect(false))
		if err != nil {
			return err
		}

		// Create a database within the dilution-demo instance
		dilutionDemoDatabase, err := sql.NewDatabase(ctx, "dilution-demo-database", &sql.DatabaseArgs{
			Instance: dilutionDemoDbInstance.Name,
			Name:     pulumi.String("dilution-demo-db"),
		})

		if err != nil {
			return err
		}
		// Fetch the values from environment variables
		dbUser := os.Getenv("dilutionDemoDatabaseUser")
		if dbUser == "" {
			dbUser = "dilutionDemoUser"
		}
		dbPassword := os.Getenv("dilutionDemoDatabasePassword")

		// Error out if the environment variables are not found
		if dbPassword == "" {
			return fmt.Errorf("please set dilutionDemoDatabasePassword env-var. dilutionDemoDatabaseUser is optional. If not set, it will default to dilutionDemoUser")
		}

		dilutionDemoDatabaseUser, err := sql.NewUser(ctx, "dilution-demo-database-user", &sql.UserArgs{
			Instance: dilutionDemoDbInstance.Name,
			Name:     pulumi.String(dbUser),
			Password: pulumi.String(dbPassword),
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

		// Export the dilution-demo Project ID
		ctx.Export("dilutionDemoProjectId", dilutionDemoApp.Project)
		// Export the dilution-demo database connection name
		ctx.Export("dilutionDemoInstanceConnectionName", dilutionDemoDbInstance.ConnectionName)
		// Export the dilution-demo Database Host and Port
		ctx.Export("dilutionDemoDatabaseHost", dilutionDemoDbInstance.PublicIpAddress)
		// Export the dilution-demo Database Name
		ctx.Export("dilutionDemoDatabaseName", dilutionDemoDatabase.Name)
		// Export the dilution-demo App Engine App URL
		ctx.Export("dilutionDemoAppUrl", pulumi.Sprintf("https://%s.appspot.com", dilutionDemoApp.ID()))
		// Export the dilution-demo Database User
		ctx.Export("dilutionDemoDatabaseUser", dilutionDemoDatabaseUser.Name)

		return nil
	})
}
