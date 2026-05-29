<?php
namespace App\Controller\Admin;

use App\Entity\Tenant\Eshop;
use App\Entity\Tenant\Ticket;
use App\Entity\Tenant\TicketMessage;
use Doctrine\ORM\EntityManagerInterface;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\JsonResponse;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Attribute\Route;
use Symfony\Component\Security\Http\Attribute\IsGranted;

#[Route('/admin/support', name: 'admin_support_')]
#[IsGranted('ROLE_ADMIN')]
class SupportController extends AbstractController
{
    public function __construct(private EntityManagerInterface $em) {}

    #[Route('/', name: 'index')]
    public function index(): Response
    {
        $userEmail = $this->getUser()->getUserIdentifier();

        $domainKey = '';
        if (str_contains($userEmail, '@')) {
            $domain    = substr($userEmail, strpos($userEmail, '@') + 1);
            $domainKey = explode('.', $domain)[0] ?? $domain;
        }

        $eshops = $this->em->getRepository(Eshop::class)
            ->createQueryBuilder('e')
            ->where('e.domain LIKE :domain')
            ->setParameter('domain', '%' . $domainKey . '%')
            ->orderBy('e.name', 'ASC')
            ->getQuery()
            ->getResult();

        $tickets = $this->em->getRepository(Ticket::class)
            ->createQueryBuilder('t')
            ->where('t.userEmail = :email')
            ->setParameter('email', $userEmail)
            ->orderBy('t.createdAt', 'DESC')
            ->getQuery()
            ->getResult();

        return $this->render('admin/support/index.html.twig', [
            'tickets'    => $tickets,
            'eshops'     => $eshops,
            'user_email' => $userEmail,
        ]);
    }

    #[Route('/new', name: 'new', methods: ['POST'])]
    public function new(Request $request): Response
    {
        $isAjax = $request->headers->get('X-Requested-With') === 'XMLHttpRequest';

        if (!$this->isCsrfTokenValid('ticket_new', $request->get('_csrf_token'))) {
            if ($isAjax) return $this->json(['error' => 'Neplatný token.'], 403);
            $this->addFlash('error', 'Neplatný CSRF token.');
            return $this->redirect('/admin/support/');
        }

        $type    = $request->get('type', '');
        $message = trim($request->get('message', ''));

        if (!$type || !$message) {
            if ($isAjax) return $this->json(['error' => 'Vyplňte všechna pole.'], 400);
            $this->addFlash('error', 'Typ a zpráva jsou povinné.');
            return $this->redirect('/admin/support/');
        }

        $userEmail = $this->getUser()->getUserIdentifier();

        // Vytvoř ticket
        $ticket = new Ticket();
        $ticket->setUserEmail($userEmail);
        $ticket->setType($type);
        $ticket->setCategory($request->get('category') ?: null);
        $ticket->setTargetEshop($request->get('target_eshop') ?: null);
        $ticket->setMessage($message);
        $ticket->setStatus('Nový');
        $this->em->persist($ticket);

        // Ulož první zprávu do TicketMessage
        $firstMsg = new TicketMessage();
        $firstMsg->setTicket($ticket);
        $firstMsg->setSenderEmail($userEmail);
        $firstMsg->setMessage($message);
        $this->em->persist($firstMsg);

        $this->em->flush();

        if ($isAjax) return $this->json(['success' => true]);

        $this->addFlash('success', 'Ticket byl odeslán.');
        return $this->redirect('/admin/support/');
    }

    #[Route('/{id}/messages', name: 'messages', methods: ['GET'])]
    public function messages(int $id): JsonResponse
    {
        $ticket = $this->em->getRepository(Ticket::class)->find($id);

        if (!$ticket) {
            return $this->json(['error' => 'Ticket nenalezen.'], 404);
        }

        $messages = $this->em->getRepository(TicketMessage::class)
            ->createQueryBuilder('m')
            ->where('m.ticket = :ticket')
            ->setParameter('ticket', $ticket)
            ->orderBy('m.createdAt', 'ASC')
            ->getQuery()
            ->getResult();

        $data = array_map(fn(TicketMessage $m) => [
            'id'          => $m->getId(),
            'senderEmail' => $m->getSenderEmail(),
            'message'     => $m->getMessage(),
            'createdAt'   => $m->getCreatedAt()->format('d.m.Y H:i'),
        ], $messages);

        return $this->json([
            'ticket' => [
                'id'     => $ticket->getId(),
                'type'   => $ticket->getType(),
                'status' => $ticket->getStatus(),
            ],
            'messages' => $data,
        ]);
    }

    #[Route('/{id}/reply', name: 'reply', methods: ['POST'])]
    public function reply(int $id, Request $request): Response
    {
        if (!$this->isCsrfTokenValid('ticket_reply_' . $id, $request->get('_csrf_token'))) {
            $this->addFlash('error', 'Neplatný CSRF token.');
            return $this->redirect('/admin/support/');
        }

        $ticket = $this->em->getRepository(Ticket::class)->find($id);
        if (!$ticket) {
            $this->addFlash('error', 'Ticket nenalezen.');
            return $this->redirect('/admin/support/');
        }

        $message = trim($request->get('message', ''));
        if (!$message) {
            $this->addFlash('error', 'Zpráva nesmí být prázdná.');
            return $this->redirect('/admin/support/');
        }

        $reply = new TicketMessage();
        $reply->setTicket($ticket);
        $reply->setSenderEmail($this->getUser()->getUserIdentifier());
        $reply->setMessage($message);
        $this->em->persist($reply);

        $ticket->setStatus('Odpovězeno');
        $this->em->flush();

        $this->addFlash('success', 'Odpověď byla odeslána.');
        return $this->redirect('/admin/support/');
    }
}
