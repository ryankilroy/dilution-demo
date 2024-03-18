import * as StockEvents from "../types/StockEvents.js";

export const formatDate = (date) => {
	return new Date(date).toLocaleString("en-US", {
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});
};
export const sortStockEventsByDate = (stockEvents) => {
	return stockEvents.sort((a, b) => a.date - b.date);
};
// Returns the number of issued shares prior to the given date
export const issuedStocksAsOfDate = (issuedStocksSeries, date) => {
	return issuedStocksSeries.reduce((mostRecent, datapoint) => {
		const isMostRecent = datapoint.x <= date && datapoint.x > mostRecent.x;
		return isMostRecent ? datapoint : mostRecent;
	}, issuedStocksSeries[0]);
};

// Find most recent stock counts for this entity
export const getMostRecentAccountStatement = (account, date) => {
	return account.statements.reduce(
		(mostRecent, statement) => {
			const isMostRecent =
				statement.date <= date && statement.date > mostRecent.date;
			return isMostRecent ? statement : mostRecent;
		},
		{ date: new Date(0), ownedStock: 0, unvestedStock: 0 }
	);
};

export const createTimeSeriesOfIssuedStocksEvents = (stockEvents) => {
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

export const createAccountsFromStockEvents = (stockEvents) => {
	const accounts = stockEvents.reduce((acc, stockEvent) => {
		// Construct a new account statement from the stock event
		const isUnvested = stockEvent.type === StockEvents.StockEventType.GRANT;
		const newAccountStatement = {
			date: stockEvent.date,
			ownedStock: isUnvested ? 0 : stockEvent.numberOfShares,
			unvestedStock: isUnvested ? stockEvent.numberOfShares : 0,
		};
		// Convert shares from unvested to vested if the stock event is a VEST
		if (stockEvent.type === StockEvents.StockEventType.VEST) {
			newAccountStatement.unvestedStock -= stockEvent.numberOfShares;
		}

		const existingAccount = acc.find(
			(account) => account.name === stockEvent.owner
		);
		// This is the first stock event for this entity, create a new account
		if (!existingAccount) {
			acc.push({
				name: stockEvent.owner,
				statements: [newAccountStatement],
			});

			return acc;
		}

		// If the account already exists, add the new statement to the account
		const recentAccountStatement = getMostRecentAccountStatement(
			existingAccount,
			stockEvent.date
		);
		// Add the previous stock count to the new statement
		newAccountStatement.ownedStock += recentAccountStatement.ownedStock;
		newAccountStatement.unvestedStock += recentAccountStatement.unvestedStock;
		existingAccount.statements.push(newAccountStatement);

		return acc;
	}, []);
	return accounts;
};

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

export const createTimeSeriesOfOwnershipPercents = (
	issuedStocksEvents,
	accounts
) => {
	return issuedStocksEvents.reduce((accum, stockEvent) => {
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
	}, []);
};
