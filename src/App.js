import React, { useRef, useEffect } from 'react';


// Layouts
import LayoutDefault from './layouts/LayoutDefault.js';

// Views
import Home from './views/Home.js';

const App = (props) => {
	const Layout = LayoutDefault
	const Component = Home
	console.log('props', props)

  return (
		<div>
			<Layout>
				<Component {...props} />
			</Layout>
		</div>
  );
}
export default App
