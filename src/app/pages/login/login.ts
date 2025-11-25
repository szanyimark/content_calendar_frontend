import { Component } from '@angular/core';
import { FormGroup, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';


@Component({
  selector: 'app-login',
  imports: [ ReactiveFormsModule, NzButtonModule, NzInputModule, NzFormModule, NzCheckboxModule ],
  standalone: true,
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class Login {
  loginForm: FormGroup;

  constructor(private fb: FormBuilder, private router: Router, private auth: AuthService,) {
    this.loginForm = fb.group({
      username: fb.control('admin@example.com', [Validators.required, Validators.email]),
      password: fb.control('password', [Validators.required, Validators.minLength(6)]),
      remember: [false]
    });
  }

  
async submitForm() {
  const result = await this.auth.login({
    email: this.loginForm.value.username,
    password: this.loginForm.value.password
  });

  console.log(result); 

  this.router.navigate(['/main']);
}

  /*
  submitForm(): void {
    console.log('submit');
    this.router.navigate(['/main']);
  }
    */
}
