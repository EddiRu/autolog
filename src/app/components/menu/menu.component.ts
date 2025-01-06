import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { IonicModule } from '@ionic/angular';
import { AuthService } from 'src/app/services/auth/auth.service';
import { StorageService } from 'src/app/services/storage/storage.service';

@Component({
  selector: 'app-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class MenuComponent  implements OnInit {
  @Input() titulo:any;

  public userRole: any;

  constructor(
    private router: Router,
    private authService: AuthService,
    private storageService: StorageService
  ) { }

  ngOnInit() {
    setTimeout(() => {
      this.getRole();
    }, 500);
  }

  async getRole(){
    const user = await this.storageService.get('currentUser');
    this.userRole = user.rol;
  }

  rToPanelControl(){
    return this.router.navigateByUrl('', {replaceUrl: true});
  }

  rToAutosPage(){
    return this.router.navigateByUrl('/autos', {replaceUrl: true});
  }

  rToPageArticulos(){
    return this.router.navigateByUrl('/articulos', {replaceUrl: true});
  }

  rToAdmUsuarios(){
    return this.router.navigateByUrl('/usuarios', {replaceUrl: true});
  }

  rToMiPerfil(){
    return this.router.navigateByUrl('/mi-perfil', {replaceUrl: true});
  }

  logout(){
    this.authService.logout();
    this.storageService.clear();
    this.router.navigateByUrl('/login', {replaceUrl: true});
  }

}
