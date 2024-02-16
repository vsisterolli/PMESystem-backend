import { Injectable } from '@nestjs/common';
import axios from 'axios';

type HabboUser = {
  motto: string,
  online: string,
  profileVisible: string,
  name: string,
  uniqueId: string
}
@Injectable()
export class HabboService {
  async findHabboUser(nick: string): Promise<HabboUser> {
    try {
      return (await axios.get(`https://www.habbo.com.br/api/public/users?name=${nick}`)).data
    } catch(e) {
      throw new Error("Usuário inexistente no habbo")
    }
  }
}
