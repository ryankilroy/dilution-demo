import { Record } from "immutable";

const StockEventType = {
	CREATE: "CREATE", // Unassigned shares are created with no owner
	ISSUE: "ISSUE", // Shares are issued to the owner
	GRANT: "GRANT", // RSU or Stock Option is granted to the owner
	VEST: "VEST", // Unvested shares vest
	// SELL: "SELL",						// Future feature
	// EXERCISE: "EXERCISE"			// Future feature
};

const StockEvent = Record({
	owner: null,
	type: null,
	date: null,
	numberOfShares: 0,
});

function createStocks(numberOfShares, date) {
	return new StockEvent({
		type: StockEventType.CREATE,
		date,
		numberOfShares,
	});
}

function issueStocks(numberOfShares, date, owner) {
	return new StockEvent({
		owner,
		type: StockEventType.ISSUE,
		date,
		numberOfShares,
	});
}

const VestScheduleType = {
	LINEAR: "LINEAR", // Shares vest linearly over time
	CLIFF: "CLIFF", // Shares vest all at once after a period of time
};

const VestSchedule = Record({
	type: VestScheduleType.LINEAR,
	numberOfShares: 0,
	startDate: null, // Date when vesting starts
	endDate: null, // Date when all shares are vested
});

const defaultVestSchedules = (numberOfShares, date) => {
	const cliffDate = new Date(date.getFullYear() + 1);
	const numOfCliffShares = numberOfShares / 4;
	return [
		new VestSchedule({
			type: VestScheduleType.CLIFF,
			numberOfShares: numOfCliffShares,
			startDate: date,
			endDate: cliffDate,
		}),
		new VestSchedule({
			type: VestScheduleType.LINEAR,
			numberOfShares: numberOfShares - numOfCliffShares,
			startDate: cliffDate,
			endDate: new Date(cliffDate.getFullYear() + 3),
		}),
	];
};

function vestStocks(numberOfShares, date, owner) {
	return new StockEvent({
		owner,
		type: StockEventType.VEST,
		date,
		numberOfShares,
	});
}

function grantStocks(numberOfShares, date, owner, vestSchedules = []) {
	if (vestSchedules.length === 0) {
		vestSchedules = defaultVestSchedules(numberOfShares, date);
	}
	const GrantStockEvents = [];

	GrantStockEvents.push(
		new StockEvent({
			owner,
			type: StockEventType.GRANT,
			date,
			numberOfShares,
		})
	);

	vestSchedules.forEach((vestSchedule) => {
		if (vestSchedule.type === VestScheduleType.CLIFF) {
			GrantStockEvents.push(
				vestStocks(vestSchedule.numberOfShares, vestSchedule.endDate, owner)
			);
		} else {
			// Figure out how many vest events based on months between start and end date assuming first of the month
			const numOfVestEvents =
				(vestSchedule.endDate.getFullYear() -
					vestSchedule.startDate.getFullYear()) *
					12 +
				(vestSchedule.endDate.getMonth() - vestSchedule.startDate.getMonth());
			const monthlyShares = vestSchedule.numberOfShares / numOfVestEvents;
			let currentDate = new Date(vestSchedule.startDate);
			for (let i = 0; i < numOfVestEvents; i++) {
				currentDate = new Date(
					currentDate.setMonth(currentDate.getMonth() + 1)
				);
				GrantStockEvents.push(vestStocks(monthlyShares, currentDate, owner));
			}
		}
	});

	return GrantStockEvents;
}

export {
	StockEvent,
	StockEventType,
	VestSchedule,
	VestScheduleType,
	createStocks,
	grantStocks,
	issueStocks,
	vestStocks,
};
