Plain = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
Cipher = "XYZABCDEFGHIJKLMNOPQRSTUVW"


def encrypt_caesar(message: str) -> str:
    
    message = message.upper()
    out = []
    for ch in message:
        if ch in Plain:
            out.append(Cipher[Plain.index(ch)])
        else:
            out.append(ch)
    return ''.join(out)


def derive_shift() -> int:
   

    # Find where Plain[0] (i.e. 'A') was moved to in the Plain alphabet
    # Cipher[0] is the cipher letter that replaces Plain[0]. Find its index in Plain.
    return Plain.index(Cipher[0])


def decrypt_caesar_substitution(message: str) -> str:

    message = message.upper()
    out = []
    for ch in message:
        if ch in Cipher:
            out.append(Plain[Cipher.index(ch)])
        else:
            out.append(ch)
    return ''.join(out)


def decrypt_using_shift(message: str, shift: int) -> str:
    """Decrypt using a numeric Caesar shift: cipher = plain + shift (mod 26).

    Decryption does plain = cipher - shift (mod 26).
    """
    message = message.upper()
    out = []
    for ch in message:
        if ch in Plain:
            ci = Plain.index(ch)
            pi = (ci - shift) % 26
            out.append(Plain[pi])
        else:
            out.append(ch)
    return ''.join(out)


def brute_force_shifts(ciphertext: str) -> dict:

    
    results = {}
    for s in range(26):
        results[s] = decrypt_using_shift(ciphertext, s)
    return results


if __name__ == '__main__':
    # Example usage and quick self-checks
    sample_plain = 'HELLO WORLD'
    encrypted = encrypt_caesar(sample_plain)
    print('Sample plain: ', sample_plain)
    print('Encrypted    :', encrypted)

    # Derive the numeric shift used by the substitution mapping
    shift = derive_shift()
    print('Derived numeric shift (0..25):', shift)

    # Decrypt using substitution mapping
    decrypted = decrypt_caesar_substitution(encrypted)
    print('Decrypted (substitution):', decrypted)

    # Decrypt using numeric shift
    decrypted_shift = decrypt_using_shift(encrypted, shift)
    print('Decrypted (numeric):     ', decrypted_shift)

    # If you have a ciphertext and want to try all shifts:
    # print(brute_force_shifts(encrypted))










