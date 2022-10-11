import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import QiscusSDK from 'qiscus-sdk-core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  title = 'poc-livestream-chat';
  qiscus = new QiscusSDK();
  email: string = 'mari@mail.com';
  pass: string = 'pass';
  channelUniqueId = 'dgpoc1234';
  room: any = null;
  listMessage: any[] = [];
  listMessageBucket: any[] = [];
  timerMessage = null;
  timerCounter = null;
  counter = 0;
  maxDurationInSeconds = 300;
  isCounting = false;
  @ViewChild('scrollContainer') scroll: ElementRef<HTMLDivElement>;

  ngOnInit(): void {
    this.qiscus.init({
      // change this into your own AppId through https://dashboard.qiscus.com
      AppId: "sdksample",
      options: {
        loginSuccessCallback: (data) => this.loginSuccess(data),
        loginErrorCallback(data) {},
        newMessagesCallback(data) {},
        groupRoomCreatedCallback(data) {},
      }
    })
      .then(() => {
        this.qiscus.setUser(this.email, this.pass, 'testUser');
      });
  }

  loginSuccess(data): void {
    this.qiscus.getOrCreateRoomByChannel(this.channelUniqueId, 'Live Stream Windah')
      .then((room) => {
        this.room = room;
        this.listMessageBucket = [...room.comments];
        const top = this.listMessageBucket[0].id
        this.loadAllComment(top);
        // this.setTimerSendMessage();
      })
  }

  loadAllComment(lastMessageId) {
    this.loadComments(this.room.id, lastMessageId)
      .then(res => {
        this.listMessageBucket.unshift(...res);
        console.log(this.listMessageBucket);
        if (res.length === 10) {
          this.loadAllComment(res[0].id);
        }
      })
  }

  loadComments(roomId: number, lastCommentId: number, isAfter: boolean = false) {
    const options = {
      last_comment_id: lastCommentId,
      after: isAfter,
      limit: 10
    };
    return this.qiscus.loadComments(roomId, options).then((comments) => {
      return comments;
    });
  }

  setTimerSendMessage(): void {
    clearInterval(this.timerMessage);
    this.timerMessage = setInterval(() => {
      const seconds = this.counter;
      const message = `ini adalah pesan pada ${new Date().toLocaleTimeString()}`;
      this.qiscus.sendComment(this.room.id, message, null, 'text', JSON.stringify({}), { time: seconds });
    }, 5000);
  }

  startCounter() {
    this.isCounting = !this.isCounting;
    if (this.isCounting) {
      clearInterval(this.timerCounter);
      this.timerCounter = setInterval(() => {
        this.counter += 1;
        this.setMessage();
      }, 1000);
    } else {
      // this.counter = 0;
      clearInterval(this.timerCounter);
    }
  }

  setMessage() {
    const scrollPos = this.scroll.nativeElement.scrollHeight - this.scroll.nativeElement.clientHeight;
    const isOnBottom = this.scroll.nativeElement.scrollTop === scrollPos;
    this.listMessage = this.fillteredMessage;
    setTimeout(() => {
      if (isOnBottom) {
        // update value
        this.scroll.nativeElement.scrollTop = this.scroll.nativeElement.scrollHeight;
      }
    }, 0)
  }

  get fillteredMessage(): any[] {
    return this.listMessageBucket.filter(message => {
      return message.extras?.time <= this.counter;
    });
  }

  setCounter($event) {
    const isPlaying = this.isCounting;
    this.isCounting = false;
    clearInterval(this.timerCounter);
    this.counter = Number($event.target.value);
    if (isPlaying) {
      this.startCounter();
    } else {
      this.setMessage();
    }
  }
}
