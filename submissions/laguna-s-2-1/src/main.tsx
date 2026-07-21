import { h, render } from 'preact';
import { App } from './App';
import './styles/global.css';

render(h(App, {}), document.getElementById('app')!);
