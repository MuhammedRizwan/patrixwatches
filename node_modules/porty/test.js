const Porty = require('./index.js');

(async function() {
	try {

		const p1 = await Porty.find({
			min: 8080,
			max: 8090,
			avoids: [8081, 8080, 8082, 8083, 8084]
		});
		console.log(`1st: ${p1}`);

		const p2 = await Porty.get();
		console.log(`2nd: ${p2}`);

		try {
			const p3 = await Porty.find({
				min: 8002,
				max: 8001
			});
			console.log(`3rd: oops something wrong`);
		} catch (e) {
			console.log(`3rd: correctly errored`);
		}

		const p4 = await Porty.test(8000);
		console.log(`4th: ${p4}`);

		const p5 = await Porty.find(9000);
		console.log(`5th: ${p5}`);

	} catch (e) {
		console.error(e);
	}
}());
