<h1 align="center">HACify</h1>

<h5 align="center">A robust API to interact with the <a href="https://homeaccess.katyisd.org/HomeAccess/Account/LogOn">Katy ISD Home Access Center</a></h5>

<div align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/language-typescript-3178C6?style=flat-square&logo=typescript"></a>
</div>

<br/>

```js
import { HACApi } from "HACify";

const API = new HACApi();
const listener = await HACApi.GetData("user", "password", {
  login: true,
  classwork: true,
});
await new Promise((res) => listener.on("login", () => res));
listener.on("classwork", (classwork) => {
  console.log(classwork);
});
listener.on("done", () => {
  console.log("finished getting data");
});
```

## Installation

## Features

- Up-to-date data every API call
  - Scrapes directly from the Home Access Center Website
- Parsed data in an easy-to-interact manner
- Coverage of almost the entirety of the Home Access Center
  - Classwork
  - Week View
  - Schedule
  - Transcript
  - IPR
  - Report Card
- Listener-based return system to prevent application hanging
  - Promise module in the works

## API

### class: HACApi

The overarching class required to interact with the API

#### Methods

| Method                           | Description                                                                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| [GetData](#method-hacapigetdata) | Takes in a username, password, and object of events/data to be scraped and parsed, and returns a listener to emit the events to |

#### Example

```js
const api = new HACApi();
```

### method: HACApi.GetData()

Takes in a username, password, and object of events/data to be scraped and parsed, and returns a listener to emit the events to

#### Parameters

| Parameter  | Type                                   | Description                                                                                                               |
| ---------- | -------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| user       | string                                 | The username to be inputted when logging in                                                                               |
| pass       | string                                 | The password corresponding with the username inputted                                                                     |
| events     | [HandlerOptions](#type-handleroptions) | An object containing keys corresponding to the data that should be scraped, parsed, then emitted                          |
| retryLimit | number                                 | The amount of times to retry if scraping a page fails _(Optional)_ _Default=0_                                            |
| timeout    | number                                 | The time to wait, in ms, until a webpage is determined unresponsive, and scraping is retried _(Optional)_ _Default=15000_ |

#### Returns

Promise<[HandlerEventEmitter](#type-handlereventemitter)>

#### Example

```js
const api = new HACApi();
const listener = await api.GetData(
  "testUsername",
  "testPassword",
  {
    login: true,
    classwork: true,
  },
  1,
  15 * 1000
);
```

### type: HandlerOptions

```ts
type HandlerOptions = {
  login?: boolean; //Emitted once
  classwork?: boolean; //Emitted multiple times, once for each six weeks
  schedule?: boolean; //Emitted two times, one for each semester
  ipr?: boolean; //Emitted one time
  transcript?: boolean; //Emitted one time
  weekView?: boolean; //Emitted one time
};
```

### class: HandlerEventEmitter

A event emitter that will emit events related to data continuously as data is scraped and parsed

#### Methods

| Method               | Description                                                                                               |
| -------------------- | --------------------------------------------------------------------------------------------------------- |
| [on](#method-on)     | Register a function that will execute when an event is emitted                                            |
| [once](#method-once) | Register a function that will execute the first time an event is emitted after the function is registered |

#### Example

```js
const api = new HACApi();
const listener = await api.GetData(
  "testUsername",
  "testPassword",
  {
    login: true,
    classwork: true,
  },
  1,
  15 * 1000
);
listener.once("login", (status) => {
  console.log(status ? "logged in" : "failed to log in");
});
listener.on("classwork", (classwork) => {
  console.log(classwork);
});
listener.once("done", () => process.exit(1));
```

### method: on

Register a function that will execute when an event is emitted

#### Parameters

| Parameter | Type                                                                                       | Description                                                   |
| --------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| eventName | K extends keyof [HandlerEvents](#type-handlerevents)                                       | The name of the event to register the function to             |
| ...args   | [HandlerEvents](#type-handlerevents)[K extends keyof [HandlerEvents](#type-handlerevents)] | The destructured arguments to recieve from the event emission |

#### Returns

this

### method: once

Register a function that will execute when an event is emitted

#### Parameters

| Parameter | Type                                                                                       | Description                                                   |
| --------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------- |
| eventName | K extends keyof [HandlerEvents](#type-handlerevents)                                       | The name of the event to register the function to             |
| ...args   | [HandlerEvents](#type-handlerevents)[K extends keyof [HandlerEvents](#type-handlerevents)] | The destructured arguments to recieve from the event emission |

#### Returns

this

### type: HandlerEvents

<pre>
type HandlerEvents = {
  login: [status: boolean];
  classwork: [classwork: <a href="#type-classwork">Classwork</a>];
  schedule: [schedule: <a href="#type-schedule">Schedule</a> | null];
  ipr: [ipr: <a href="#type-ipr">IPR</a> | null];
  transcript: [transcript: <a href="#type-transcript">Transcript</a> | null];
  weekView: [weekView: <a href="#type-weekview">WeekView</a> | null];
  done: [];
};
</pre>

### type: Classwork

```ts
interface Classwork {
  sixWeeks: number;
  classes: {
    [className: string]: {
      avgGrade: number | null;
      assignments: {
        dateDue: Date | null;
        dateAssigned: Date | null;
        assignment: string;
        category: string;
        score: number | string | null;
        totalPoints: number | string | null;
        dropped: boolean;
      };
    };
  };
}
```

### type: Schedule

```ts
interface Schedule {
  semester: number;
  schedule: {
    class: {
      course: string;
      class: string;
      period: string;
      teacher: string;
      room: string;
    };
    days: ("M" | "T" | "W" | "R" | "F")[];
    markingPeriods: ("M1" | "M2" | "M3" | "M4" | "M5" | "M6")[];
    building: string;
    status: boolean;
  }[];
}
```

### type: IPR

```ts
interface IPR {
  reports: {
    class: {
      course: string;
      class: string;
      period: string;
      teacher: string;
      room: string;
    };
    prg: number | null;
  }[];
}
```

### type: Transcript

```ts
interface Transcript {
  transcripts: {
    year: string;
    semester: number;
    gradeLevel: number;
    building: string;
    entries: {
      class: {
        course: string;
        class: string;
      };
      avg: number | null;
      credit: number | null;
    };
    totalCredit: number;
  }[];
  weighted: {
    type: string;
    gpa: number | null;
  };
  unweighted: {
    type: string;
    gpa: number | null;
  };
  rank: number | null;
  quartile: number | null;
}
```

### type: WeekView

```ts
interface WeekView {
  [key in ("M" | "T" | "W" | "R" | "F")]: {
    dayOff: boolean;
    classes: {
      [className: string]: {
        class: {
          course: string;
          class: string;
          period: string;
          teacher: string;
        };
        assignments: {
          assignment: string;
          score: number | string | null;
          totalPoints: number | string | null;
        }[];
      };
    };
  };
}
```

## Warnings

- The API depends on scraping its data manually from Home Access Center
  - Speeds may rely on Home Access Center server speeds
  - Home Access Center website outages will cause API issues
- API speeds are slow due to the need to scrape (upwards of 13 seconds)

## Best Practices

- Cache data if possible every pull
- Pull only what you need to, and nothing else
- Try not to request multiple times for the same user concurrently
