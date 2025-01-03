import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class MenuComponent  implements OnInit {
  @Input() titulo:any;

  constructor(
    private router: Router
  ) { }

  ngOnInit() {}

  rToPanelControl(){
    return this.router.navigateByUrl('', {replaceUrl: true});
  }

  rToAutosPage(){
    return this.router.navigateByUrl('/autos', {replaceUrl: true});
  }

}