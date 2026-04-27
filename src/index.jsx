import { render } from 'solid-js/web'
import { Router } from '@solidjs/router'
import App from './App'

render(() => <Router root={App} />, document.getElementById('root'))