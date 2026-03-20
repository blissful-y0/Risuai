import { beforeEach, describe, expect, test, vi } from 'vitest'
import { NodeStorage } from './nodeStorage'

const {
    alertInputMock,
    alertErrorMock,
    waitAlertMock,
    getKeypairStoreMock,
    saveKeypairStoreMock,
} = vi.hoisted(() => ({
    alertInputMock: vi.fn(),
    alertErrorMock: vi.fn(),
    waitAlertMock: vi.fn(),
    getKeypairStoreMock: vi.fn(),
    saveKeypairStoreMock: vi.fn(),
}))

vi.mock('../alert', () => ({
    alertError: alertErrorMock,
    alertInput: alertInputMock,
    waitAlert: waitAlertMock,
}))

vi.mock('../util', () => ({
    base64url: (value: Buffer | Uint8Array) => Buffer.from(value).toString('base64url'),
    getKeypairStore: getKeypairStoreMock,
    saveKeypairStore: saveKeypairStoreMock,
}))

vi.mock('src/lang', () => ({
    language: {
        setNodePassword: '보안을 위해 비밀번호를 정해주세요',
        inputNodePassword: '비밀번호를 입력해주세요',
    },
}))

function makeJsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            'content-type': 'application/json',
        },
    })
}

function makeBinaryResponse(text: string, status = 200) {
    return new Response(Buffer.from(text, 'utf-8'), { status })
}

describe('NodeStorage', () => {
    beforeEach(() => {
        vi.clearAllMocks()

        // 테스트에서는 키 저장소 자체는 관심사가 아니므로 항상 새 키를 만드는 흐름으로 고정한다.
        getKeypairStoreMock.mockResolvedValue(null)
        saveKeypairStoreMock.mockResolvedValue(undefined)
        alertInputMock.mockResolvedValue('secret-password')
        waitAlertMock.mockResolvedValue(undefined)

        vi.stubGlobal('crypto', {
            subtle: {
                exportKey: vi.fn(async () => ({ kty: 'EC', x: 'x', y: 'y' })),
            },
        })
    })

    test('기존 비밀번호 로그인 실패를 getItem Error로 숨기지 않고 원인 오류를 그대로 반환한다', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input)
            if (url === '/api/test_auth') {
                return makeJsonResponse({ status: 'incorrect' })
            }
            if (url === '/api/crypto') {
                return new Response('hashed-password', { status: 200 })
            }
            if (url === '/api/login') {
                return makeJsonResponse({ error: 'Password incorrect' }, 400)
            }
            if (url === '/api/read') {
                return makeBinaryResponse('should-not-reach')
            }
            throw new Error(`unexpected fetch: ${url}`)
        })
        vi.stubGlobal('fetch', fetchMock)

        const storage = new NodeStorage()
        vi.spyOn(storage, 'createAuth').mockResolvedValue('header.payload.signature')
        vi.spyOn(storage, 'getKeyPair').mockResolvedValue({
            privateKey: {} as CryptoKey,
            publicKey: {} as CryptoKey,
        })

        await expect(storage.getItem('database/database.bin')).rejects.toBe('Password incorrect')
        expect(fetchMock).not.toHaveBeenCalledWith('/api/read', expect.anything())
    })

    test('처음 비밀번호를 설정한 직후에도 공개키를 등록해 첫 getItem 요청이 성공한다', async () => {
        const fetchMock = vi.fn(async (input: RequestInfo | URL) => {
            const url = String(input)
            if (url === '/api/test_auth') {
                return makeJsonResponse({ status: 'unset' })
            }
            if (url === '/api/crypto') {
                return new Response('hashed-password', { status: 200 })
            }
            if (url === '/api/set_password') {
                return makeJsonResponse({ status: 'success' })
            }
            if (url === '/api/login') {
                return makeJsonResponse({ status: 'success' })
            }
            if (url === '/api/read') {
                return makeBinaryResponse('hello-node-storage')
            }
            throw new Error(`unexpected fetch: ${url}`)
        })
        vi.stubGlobal('fetch', fetchMock)

        const storage = new NodeStorage()
        vi.spyOn(storage, 'createAuth').mockResolvedValue('header.payload.signature')
        vi.spyOn(storage, 'getKeyPair').mockResolvedValue({
            privateKey: {} as CryptoKey,
            publicKey: {} as CryptoKey,
        })

        const result = await storage.getItem('database/database.bin')

        expect(Buffer.from(result).toString('utf-8')).toBe('hello-node-storage')
        expect(fetchMock).toHaveBeenCalledWith('/api/login', expect.anything())
        expect(fetchMock).toHaveBeenCalledWith('/api/read', expect.anything())
    })
})
