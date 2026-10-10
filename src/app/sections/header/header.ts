import { Component } from '@angular/core';
import { MatButton } from '@angular/material/button';

@Component({
  imports: [MatButton],
  selector: 'app-header',
  styleUrl: './header.scss',
  templateUrl: './header.html',
})
export class Header {}
