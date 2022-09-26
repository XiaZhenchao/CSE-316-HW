import jsTPS_Transaction from "../common/jsTPS.js"
/**
 * MoveSong_Transaction
 * 
 * This class represents a transaction that works with drag
 * and drop. It will be managed by the transaction stack.
 * 
 * @author McKilla Gorilla
 * @author Zhenchao Xia
 */
export default class EditSong_Transaction extends jsTPS_Transaction {
    constructor(initApp, index,oldSong,newSong) {
        super();
        this.app = initApp;
        this.index = index;
        this.oldSong = oldSong;
        this.newSong = newSong;
    }

    doTransaction() {
        this.app.renameSong(this.index,this.newSong);
    }
    
    undoTransaction() {
        this.app.renameSong(this.index,this.oldSong);
    }
}