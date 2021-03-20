import {
	read,
	write
} from "./index.js"

let conf = read("./test.conf");

console.log(conf);

let oot = write("./test-out.conf", {
	message: "Yo",
	subject: "lo",
});

console.log(oot);