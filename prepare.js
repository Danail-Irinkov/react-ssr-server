import fs from 'fs'
if (!fs.existsSync('./node_modules/react-dom/server.cjs'))
	fs.copyFile('./node_modules/react-dom/server.js', './node_modules/react-dom/server.cjs', (err) => {
		if (err) throw err;
		console.log('react-dom/server.js was copied to react-dom/server.cjs');
	});
