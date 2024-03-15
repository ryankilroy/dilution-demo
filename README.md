# Dilution Demo
## Project Overview
The point of this demo was just to spike and try to improve my understanding of private equity while messing around with Pulumi. It utilizes React on the Frontend (`/web`) and theoretically would use golang for the server and database connections (that's very much not operational at this point though). The infrastructure is run using `pulumi` and GCP. (Also very barebones)

I used ApexCharts to visualize the changing percentages of stock ownership among different stakeholders as shares are issued, vested, or granted. The aim is to, interactive representation of how ownership dilutes based on various stock events such as issuance, vesting, and grants.

## Installation
### pulumi
***Note** - Pulumi currently also spins us a GCP SQL database, but it's not being used yet, so you really don't need to bother*
```bash
cd infra
gcloud auth login
pulumi config set gcp:project <your-project>
pulumi up
```
### npm
```bash
cd web
npm install
npm run local   #spins up localhost
npm run upload  #spins up on your pulumi infrastructure
```

### go 
*Not Implemented*
