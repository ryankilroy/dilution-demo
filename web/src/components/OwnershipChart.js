import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import * as StockEvents from "../types/StockEvents.js";

const formatDate = (date) => {
	return new Date(date).toLocaleString("en-US", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
};

const sortStockEventsByDate = (stockEvents) => {
	return stockEvents.sort((a, b) => a.date - b.date);
};

// Returns the number of issued shares prior to the given date
const issuedStocksAsOfDate = (issuedStocksSeries, date) => {
	return issuedStocksSeries.reduce((mostRecent, datapoint) => {
		const isMostRecent = datapoint.x <= date && datapoint.x > mostRecent.x;
		return isMostRecent ? datapoint : mostRecent;
	}, issuedStocksSeries[0]);
};

// Find most recent stock counts for this entity
const mostRecentAccountStatement = (account, date) => {
	return account.statements.reduce((mostRecent, statement) => {
		const isMostRecent =
			statement.date <= date && statement.date > mostRecent.date;
		return isMostRecent ? statement : mostRecent;
	}, account.statements[0]);
};

const createTimeSeriesOfIssuedStocksEvents = (stockEvents) => {
	// Filter stock events to only include ISSUE and VEST events
	const issuedStockEvents = stockEvents.filter(
		(event) =>
			event.type === StockEvents.StockEventType.ISSUE ||
			event.type === StockEvents.StockEventType.VEST // TODO: exercising options as soon as they vest is not a good assumption
	);
	// Create a time series of issued shares
	return issuedStockEvents.reduce((series, stockEvent) => {
		const currentIssuedShares =
			series.length >= 1 ? series[series.length - 1].y : 0;
		series.push({
			x: stockEvent.date,
			y: currentIssuedShares + stockEvent.numberOfShares,
		});
		return series;
	}, []);
};

function populateTimeSeriesFromStockEvents(stockEvents, accounts, setAccounts) {
	// Filter stock creation events for now
	const filteredStockEvents = stockEvents.filter((stockEvent) => {
		return stockEvent.type !== StockEvents.StockEventType.CREATE;
	});

	const sortedStockEvents = sortStockEventsByDate(filteredStockEvents);

	// Create an array of AccountStatements for each account owner
	accounts = sortedStockEvents.reduce((acc, stockEvent) => {
		// Construct a new account statement from the stock event
		const isUnvested = stockEvent.type === StockEvents.StockEventType.GRANT;
		const newAccountStatement = {
			date: stockEvent.date,
			ownedStock: isUnvested ? 0 : stockEvent.numberOfShares,
			unvestedStock: isUnvested ? stockEvent.numberOfShares : 0,
		};
		if (stockEvent.type === StockEvents.StockEventType.VEST) {
			newAccountStatement.unvestedStock -= stockEvent.numberOfShares;
		}

		const existingAccount = acc.find(
			(account) => account.name === stockEvent.owner
		);
		if (!existingAccount) {
			// This is the first stock event for this entity, create a new account
			acc.push({
				name: stockEvent.owner,
				statements: [newAccountStatement],
			});

			return acc;
		}

		const recentAccountStatement = mostRecentAccountStatement(
			existingAccount,
			stockEvent.date
		);
		// Add the previous stock count to the new statement
		newAccountStatement.ownedStock += recentAccountStatement.ownedStock;
		newAccountStatement.unvestedStock += recentAccountStatement.unvestedStock;
		existingAccount.statements.push(newAccountStatement);

		return acc;
	}, []);
	setAccounts(accounts);
}

function addOwnershipPercentToSeries(
	ownershipPercents,
	owner,
	date,
	ownedStockCount,
	issuedStockTotal
) {
	if (issuedStockTotal === 0) {
		console.error(`No issued shares as of ${formatDate(date)}. Skipping...`);
		return;
	}

	const datapoint = {
		x: formatDate(date),
		y: (ownedStockCount / issuedStockTotal) * 100,
	};

	let ownerSeries = ownershipPercents.find((series) => series.name === owner);
	if (!ownerSeries) {
		ownerSeries = {
			name: owner,
			data: [],
		};
		ownershipPercents.push(ownerSeries);
	}

	ownerSeries.data.push(datapoint);
}

function OwnershipChart() {
	const incorporationStockEvents = [].concat(
		StockEvents.createStocks(10000000, new Date("2023-01-01")),
		StockEvents.issueStocks(3950000, new Date("2024-02-02"), "Eren"),
		StockEvents.issueStocks(3050000, new Date("2026-03-03"), "Mikasa"),
		StockEvents.grantStocks(2550000, new Date("2025-04-4"), "Armin")
	);

	const [options, setOptions] = useState({
		chart: {
			id: "share-chart",
		},
		dataLabels: {
			enabled: false,
		},
		legend: {
			customLegendItems: ["Eren", "Mikasa", "Armin"],
		},
		stroke: {
			width: 3,
			curve: "smooth",
		},
		xaxis: {
			type: "datetime",
		},
		yaxis: {
			labels: {
				formatter: (value) => {
					return value ? value.toFixed(0) + "%" : "";
				},
			},
			min: 0,
			max: 100,
		},
	});

	const [stockEvents, setStockEvents] = useState(incorporationStockEvents);
	const [accounts, setAccounts] = useState([]);
	const [ownershipPercents, setOwnershipPercents] = useState([]);

	useEffect(() => {
		populateTimeSeriesFromStockEvents(stockEvents, accounts, setAccounts);
	}, [stockEvents, accounts]);

	useEffect(() => {
		const issuedStocksEvents =
			createTimeSeriesOfIssuedStocksEvents(stockEvents);

		// Compute new ownership percentages without directly modifying state
		const newOwnershipPercents = issuedStocksEvents.reduce(
			(accum, stockEvent) => {
				const date = stockEvent.x;
				const currentIssuedShares = issuedStocksAsOfDate(
					issuedStocksEvents,
					date
				).y;
				console.log("Date:", date);
				console.log("Shares:", currentIssuedShares);
				const tempOwnershipPercents = [...accum]; // Clone to avoid direct state mutation

				accounts.forEach((account) => {
					const recentAccountStatement = mostRecentAccountStatement(
						account,
						date
					);
					const ownedStockCount = recentAccountStatement
						? recentAccountStatement.ownedStock
						: 0;
					// Instead of modifying state, modify a temporary variable
					addOwnershipPercentToSeries(
						tempOwnershipPercents, // Pass the cloned array instead of the state directly
						account.name,
						date,
						ownedStockCount,
						currentIssuedShares
					);
				});

				return tempOwnershipPercents;
			},
			[...ownershipPercents]
		);

		setOwnershipPercents(newOwnershipPercents);
	}, [stockEvents, accounts]);

	return (
		<div className="row">
			<div className="mixed-chart">
				<Chart
					options={options}
					series={ownershipPercents}
					type="area"
					width={500}
				/>
			</div>
		</div>
	);
}

export default OwnershipChart;
