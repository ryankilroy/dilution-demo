import React, { useEffect, useState } from "react";
import Chart from "react-apexcharts";
import * as StockEvents from "../types/StockEvents.js";
import {
	createAccountStatements,
	createTimeSeriesOfIssuedStocksEvents,
	formatDate,
	getMostRecentAccountStatement,
	issuedStocksAsOfDate,
	sortStockEventsByDate,
} from "./utils.js";

function populateTimeSeriesFromStockEvents(stockEvents, setAccounts) {
	// Filter out stock creation events
	// TODO: Add functionality around unissued, authorized shares
	const filteredStockEvents = stockEvents.filter((stockEvent) => {
		return stockEvent.type !== StockEvents.StockEventType.CREATE;
	});
	if (filteredStockEvents.length === 0) {
		console.error("No stock events to process. Skipping...");
		return;
	}

	const sortedStockEvents = sortStockEventsByDate(filteredStockEvents);
	// Create an array of AccountStatements for each account owner
	const newAccounts = createAccountStatements(sortedStockEvents);
	console.log("newAccounts", newAccounts);
	setAccounts(newAccounts);
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
			type: "area",
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
		StockEvents.issueStocks(3050000, new Date("2024-05-05"), "Mikasa"),
		StockEvents.grantStocks(2550000, new Date("2025-04-04"), "Armin")
	);
	const optionsObject = {
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
	};

	const [options, setOptions] = useState(optionsObject);
	const [stockEvents, setStockEvents] = useState(incorporationStockEvents);
	const [accounts, setAccounts] = useState([]);
	const [ownershipPercents, setOwnershipPercents] = useState([]);

	useEffect(() => {
		const issuedStocksEvents =
			createTimeSeriesOfIssuedStocksEvents(stockEvents);

		populateTimeSeriesFromStockEvents(stockEvents, setAccounts);
		if (!accounts) {
			console.error("No accounts to process. Skipping...");
			return;
		}

		// Compute new ownership percentages without directly modifying state
		const newOwnershipPercents = issuedStocksEvents.reduce(
			(accum, stockEvent) => {
				const date = stockEvent.x;
				const currentIssuedShares = issuedStocksAsOfDate(
					issuedStocksEvents,
					date
				).y;
				const tempOwnershipPercents = [...accum];

				accounts.forEach((account) => {
					const recentAccountStatement = getMostRecentAccountStatement(
						account,
						date
					);
					const ownedStockCount = recentAccountStatement
						? recentAccountStatement.ownedStock
						: 0;
					// Instead of modifying state, modify a temporary variable
					addOwnershipPercentToSeries(
						tempOwnershipPercents,
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
	}, [stockEvents, accounts, ownershipPercents]);

	return (
		<div className="row">
			<div className="mixed-chart">
				<Chart options={options} series={ownershipPercents} width={1000} />
			</div>
		</div>
	);
}

export default OwnershipChart;
