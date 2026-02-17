import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';
import { SummaryCardsComponent } from '../../components/summary-cards/summary-cards.component';

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, SummaryCardsComponent],
  templateUrl: './main-layout.component.html',
  styleUrls: ['./main-layout.component.css']
})
// ¡AQUÍ! Asegúrate de que tenga la palabra 'export'
export class MainLayoutComponent { 
  // ... tu código
}