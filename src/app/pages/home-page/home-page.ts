import { Component } from '@angular/core';
import { Header } from '../../sections/header/header';

@Component({
  imports: [Header],
  selector: 'app-home-page',
  styleUrl: './home-page.scss',
  templateUrl: './home-page.html',
})
export class HomePage {}
