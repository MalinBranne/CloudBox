import { Injectable } from '@angular/core';
import { FileService } from './file.service';

@Injectable()
export class StarredService {

  constructor(private fileService: FileService) { }

}
