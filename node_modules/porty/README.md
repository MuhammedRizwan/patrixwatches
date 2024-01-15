
# Porty
Porty quickly and easily find available ports.

## Install
`npm i porty --save`

## Example

```js
const port = await Porty.find({
	min: 8080,
	max: 8090,
	avoids: [8081, 8080, 8082, 8083, 8084]
});

console.log(port); // 8085
```

## Porty.test(port)
Tests if a port is in use. Returns a boolean.
- `port: Number` port to test

## Porty.find([options,] [min, max, avoids])
Arguments can be a single object or one/two number arguments. All arguments are optional. Return value is a open port number `>= min <= max`.

- `options: Object`
	- `min: Number` port number to start (default: 8,000)
	- `max: Number` port number to end (default: 10,000)
	- `avoids: Array` array of port numbers to avoid
- `min: Number`
- `max: Number`
- `avoids: Array`

## Porty.get
Alias for Porty.find

## Authors
[AlexanderElias](https://github.com/AlexanderElias)

## License
[Why You Should Choose MPL-2.0](http://veldstra.org/2016/12/09/you-should-choose-mpl2-for-your-opensource-project.html)
This project is licensed under the MPL-2.0 License
