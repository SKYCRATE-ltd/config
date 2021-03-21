import {
	readlines,
	write as write_file
} from "computer";

// We get features without having to import anything in particular.
import {
	Class,
	Procedure,
	Integer,
	Double
} from "zed";

const TRIM = (x => x.trim());
const stringify = value => value.constructor.stringify(value);

class Email extends Class(String, {
	user: String,
	domain: String
}) {
	static expression = /^.+@.+\..+$/;
	constructor(user, domain) {
		super(`${user}@${domain}`);
		this.user = user;
		this.domain = domain;
	}
	static validate(string) {
		return this.expression.test(string);
	}
}

class Path extends Class(String) {
	static expression = /^(~|\.)?([\+~%\/\.\w\-_]*)+$/;
	constructor(path) {
		// something we do with paths...
		if (!Path.validate(path))
			throw `${path} is not a valid path.`;
	}
	static validate(string) {
		return this.expression.test(string);
	}
}

class Url extends Path {
	// We could probably clean this one up...
	static expression = /((([A-Za-z]{2,9}:(?:\/\/)?)(?:[\-;:&=\+\$,\w]+@)?[A-Za-z0-9\.\-]+|(?:www\.|[\-;:&=\+\$,\w]+@)[A-Za-z0-9\.\-]+)((?:\/[\+~%\/\.\w\-_]*)?\??(?:[\-\+=&;%@\.\w_]*)#?(?:[\.\!\/\\\w]*))?)/;
}

const TYPES = [
	Integer,
	Double,
	Boolean,
	Date,
	// Url,
	// Path, // TODO: work on these.. we need one for Null as well...
	Email,
	String
];

const Parser = Procedure({
	_pattern: RegExp,
	init(pattern, operation) {
		this._pattern = pattern;
		return (line, index, lines) => {
			const [key, value] = this.extract(line).map(TRIM);
			return [key, operation(value || key, index, lines)];
		};
	},
	test(string) {
		// console.log(
		// 	this._pattern.toString() +
		// 		` for "${string}" => ${this._pattern.test(string)}`);
		return this._pattern.test(string);
	},
	extract(string) {
		return this._pattern.exec(string)?.slice(1) || [];
	}
});

const PARSERS = [
	Parser(
		/^([_a-z0-9]+):([_a-z0-9]+)$/i,
		type => TYPES.find(T => T.name === type)
	),
	Parser(
		/^([_a-z0-9]+)=(.+)?$/,
		value => TYPES.find(T => T.validate(value)).parse(value)
	),
	Parser(
		/^\[\s?(\w+)\s?\]$/,
		(section, index, lines, pivot = index + 1) => {
			let reste = lines.slice(pivot);
			let ind = reste.findIndex(line => line.startsWith('['));
			return parse(lines.splice(pivot, ind > -1 ? ind : reste.length));
		}
	)
];

export function parse(lines) {
	return Object.fromEntries(new Map(lines.map(
		(line, index, lines) => {
			const parser = PARSERS.find(parser => parser.test(line));
			return parser(line, index, lines);
		}
	)));
};

export function read(file) {
	return parse(readlines(file));
};

export function write(path, obj) {
	// Sort the object such that any keys with objects as values are kept to the end.
	// We don't need it right now though. So, how do we test this sucker then?
	return write_file(path, Object.entries(obj).map(([key, value]) => `${key}=${stringify(value)}`).join('\n'));
};
