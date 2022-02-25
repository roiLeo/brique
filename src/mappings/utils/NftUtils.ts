import { Interaction } from '../../model';
const SQUARE = '::'

export function isHex(text: string) {
  return text.startsWith('0x')
}

export function hexToString(text: string) {
  return isHex(text) ? Buffer.from(text.replace(/^0x/, ''), 'hex').toString() : text 
}

class NFTUtils {
  public static decode(value: string) {
    return decodeURIComponent(value);
  }

  public static decodeRmrk(rmrkString: string): string {
    return NFTUtils.decode(
      isHex(rmrkString) ? hexToString(rmrkString) : rmrkString
    );
  }

 
  public static getAction = (rawAction: string): Interaction  => {
    if ((<any>Object).values(Interaction).includes(rawAction)) {
      return Interaction[rawAction as Interaction]
    }
    throw new EvalError(`[NFTUtils] Unable to get action - ${rawAction}`);
  }

  public static unwrap(rmrk: string): Array<string> {
    try {
      const decoded = decodeURIComponent(rmrk)
      // const rr: RegExp = /{.*}/
      // const match = decoded.match(rr)

      // if (match) {
      //   return JSON.parse(match[0])
      // }

      const split = decoded.split(SQUARE)
      return split

      // if (split.length >= 4) {
      //   return ({
      //     id: split[3],
      //     metadata: split[4]
      //   } as RmrkInteraction)
      // }

      throw new TypeError(`RMRK: Unable to unwrap object ${decoded}`)
    } catch (e) {
      throw e
    }
  }

}


export default NFTUtils
