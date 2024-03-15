import React, { useState } from "react";
import Chart from "react-apexcharts";
import * as StockEvents from "../types/StockEvents.js";
import "./OwnershipChart.js";

const formatDate = (date) => {
	new Date(date).toLocaleString("en-US", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
};

// Returns the number of issued shares prior to the given date
const issuedSharesAsOfDate = (issuedSharesSeries, date) => {
	const priorDatapoint = issuedSharesSeries.find(
		(datapoint) => datapoint.x <= date
	);
	return priorDatapoint ? priorDatapoint.y : 0;
};

function seriesOfIssuedShares(stockEvents) {
	// Filter stock events to only include ISSUE and VEST events
	const issuedStockEvents = stockEvents.filter(
		(event) =>
			event.type === StockEvents.StockEventType.ISSUE ||
			event.type === StockEvents.StockEventType.VEST // exercise is implied
	);
	// Create a time series of issued shares
	return issuedStockEvents.reduce((series, stockEvent) => {
		const currentIssuedShares =
			series.length > 1 ? series[series.length - 1].y : 0;
		series.push({
			x: formatDate(stockEvent.date),
			y: currentIssuedShares + stockEvent.numberOfShares,
		});
		return series;
	}, []);
}

function seriesFromStockEvents(stockEvents) {
	const issuedSharesSeries = seriesOfIssuedShares(stockEvents);
	// Create a series for each grant owner
	return stockEvents.reduce((series, stockEvent) => {
		// "Owner" on ISSUE or VEST, "Owner (Unvested)" on GRANT
		let seriesName = stockEvent.owner;
		if (stockEvent.type === StockEvents.StockEventType.GRANT) {
			seriesName += " (Unvested)";
		}
		const existingSeries = series.find((s) => s.name === seriesName);
		const percentOwnership =
			(stockEvent.numberOfShares /
				issuedSharesAsOfDate(issuedSharesSeries, stockEvent.date)) *
			100;
		const datapoint = {
			x: formatDate(stockEvent.date),
			// Calculate the percentage of issued shares for the owner
			y: percentOwnership,
		};
		if (existingSeries) {
			existingSeries.data.push(datapoint);
		} else {
			const seriesType =
				stockEvent.type === StockEvents.StockEventType.GRANT ? "line" : "area";
			series.push({
				name: seriesName,
				type: seriesType,
				data: [datapoint],
			});
		}
		return series;
	}, []);
}

function OwnershipChart() {
	const incorporationStockEvents = [
		StockEvents.createStocks(10000000, new Date("2024-01-01")),
		StockEvents.issueStocks(4950000, new Date("2024-01-01"), "Eren"),
		StockEvents.issueStocks(4050000, new Date("2024-01-01"), "Mikasa"),
		StockEvents.grantStocks(50000, new Date("2024-04-14"), "Armin"),
	];

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
		},
	});

	const [stockEvents, setStockEvents] = useState(incorporationStockEvents);
	const [series, setSeries] = useState(seriesFromStockEvents(stockEvents));

	return (
		<div className="row">
			<div className="mixed-chart">
				<Chart options={options} series={series} type="area" width={500} />
			</div>
		</div>
	);
}

export default OwnershipChart;
